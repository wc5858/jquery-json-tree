(function ($) {
    $.fn.extend({
      JSONTreeSingle: function (data, options) {
        var viewBox = $(this);
        var settings = $.extend({
          //type 1: JSON
          //     2: ApiInfo
          type: 1,
          //是否允许被展开
          collapsible: true,
          //是否只读
          readOnly: false,
          //是否允许数组添加（复制最后一项）和删除项（删除至一项至少一项）
          arrAddable: true,
          arrAlert: '数组最后一个元素不允许删除！',
          //显示类型
          showType: false,
          //ApiInfo的编辑模式
          apiEditMode: false,
          //JSON编辑模式中，
          onChange: null
        },options);
  
        viewBox.bind('changeContent', function () {
          if (settings.onChange) {
            settings.onChange(viewBox.getTreeData());
          }
        });
  
        var _type = function (type) {
          if (settings.showType) {
            return '<span class="type"> (' + type + ')</span>';
          }
          return '';
        };
  
        var _keyNmae = function (tag, type, empty) {
          if (empty) {
            return '<input class="tag" placeholder="name"> : ';
          }
          if (settings.apiEditMode && typeof(tag) !== "undefined") {
            return '<input class="tag" placeholder="name" value="' + tag + '"><span class="colon"> : </span>';
          }
          return '<span class="tag">' + (typeof(tag) !== "undefined" ? tag + _type(type) + ': ' : '') + '</span>';
        };
  
        var _delete = function (deletable) {
          if (deletable) {
            return '<span class="delete">-</span>';
          }
          return '';
        };
  
        var _dscInput = function (value) {
          if (typeof(value) !== "undefined") {
            return '<span class="dsc-tip">描述：</span><input class="dsc" placeholder="description" value="' + value + '">';
          }
          return '<span class="dsc-tip">描述：</span><input class="dsc" placeholder="description">';
        };
  
        var _dsc = function (dsc) {
          if (settings.apiEditMode && typeof(dsc) != "undefined") {
            return _dscInput(dsc);
          }
          if (settings.type == 2 && typeof(dsc) != "undefined") {
            return '<span class="dsc">' + dsc + '</span>';
          }
          return '';
        };
  
        var _add = function (addable) {
          if (addable) {
            return '<span class="add">+</span>';
          }
          return '';
        };
  
        var _toggle = function () {
          if (settings.collapsible) {
            return '<span class="toggle"><i class="fa fa-caret-down"></i> </span>';
          }
          return '';
        };
  
        var _typeSelect = function (value) {
          var select = $('<select>');
          var ops = ['boolean', 'integer', 'number', 'string', 'array', 'object'];
          for (var i in ops) {
            select.append($('<option>', {
              value: ops[i],
              text: ops[i]
            }))
          };
          if (value) {
            select.val(value);
          }
          return select;
        };
  
        var _jsValue = function (value, type) {
          if (!settings.readOnly) {
            return '<input class="content ' + type + '" value="' + value + '">';
          }
          if (settings.apiEditMode) {
            return _typeSelect(value);
          }
          return '<span class="content ' + (settings.type == 1 ? type : 'string') + '">' + value + '</span>';
        };
  
        var _p = function (keyname, value, type, deletable, description) {
          var dsc = '';
          if (typeof(description) !== "undefined") {
            dsc = _dsc(value.description);
          }
          var p = $('<p>');
          p.append(
            _keyNmae(keyname, type),
            _jsValue(value, type),
            _dsc(description),
            _delete(deletable)
          )
          return p;
        };
  
        var _checkType = function (value, index, deletable) {
          if (settings.type == 1) {
            if (value !== null) {
              var type = typeof value;
              switch (type) {
                case 'boolean':
                case 'number':
                case 'string':
                  return _p(index, value, type, deletable);
                default:
                  if (value instanceof Array) {
                    return _jsList(value, index, deletable, 'arr');
                  } else {
                    return _jsList(value, index, deletable, 'obj');
                  }
              }
            } else {
              return _p(index, value, 'null', deletable);
            }
          } else if (settings.type == 2) {
            if (!$.isEmptyObject(value)) {
              switch (value.type) {
                case 'boolean':
                case 'integer':
                case 'number':
                case 'string':
                  return _p(index, value.type, value.type, deletable, value.description);
                case 'array':
                  return _jsList(value, index, deletable, value.type, value.description);
                case 'object':
                  return _jsList(value.properties, index, deletable, value.type, value.description);
                default:
                  return _p(index, value.type, 'unknown', deletable, value.description);
              }
            } else {
              return _empty();
            }
          }
        };
  
        var _empty = function () {
          var dom = $('<ul>', {
            'data-type' : 'object'
          });
          var p = $('<p>');
          p.append(
            _toggle(),
            '{',
            _add(true)
          )
          dom.prepend(p).append('<p>' + '}' + '</p>');
          return dom;
        };
  
        var _emptyArr = function (name, dsc) {
          var dom = $('<ul>', {
            'data-type' : 'array'
          });
          var p = $('<p>');
          p.append(
            _toggle(),
            _keyNmae(name, 'arr'),
            _typeSelect('array'),
            '['
          )
          dom.prepend(p).append('<p>' + ']' + _dsc(dsc) + _delete(true) + '</p>');
          return dom;
        };
  
        var _jsList = function (d, index, deletable, type, dsc) {
          var isArr = type == 'arr' || type == 'array';
          var codeLeft = isArr ? '[' : '{';
          var codeRight = isArr ? ']' : '}';
          var addable = (settings.arrAddable && isArr && !settings.readOnly) || (settings.apiEditMode && !isArr);
  
          var dom = $('<ul>', {
            'data-type' : type
          });
          if (!isArr || (isArr && settings.type == 1)) {
            for (var key in d) {
              li = $('<li>').html(_checkType(d[key], key, addable));
              dom.append(li);
            }
          } else {
            li = $('<li>').html(_checkType(d.items, 'items', addable));
            dom.append(li);
          }
          dom.prepend('<p>' + _toggle() + _keyNmae(index, type) + codeLeft + _add(addable) + '</p>')
            .append('<p>' + codeRight + _dsc(dsc)+ _delete(deletable) + '</p>');
          return dom;
        };
  
        var _reorder = function (fa) {
          fa.children('li').each(function () {
            $(this).find('.tag').first().text($(this).index() - 1 + ': ');
          })
        };
  
        var _endInput = function(el) {
          var li = el.closest('li');
          var value = {};
          if (li.children('ul').length == 0) {
            var fa = li.children('p');
            value = {
              type: fa.children('select').val(),
              description : fa.children('.dsc').val()
            };
            var name = fa.children('.tag').val();
          } else {
            value = {
              type: el.val(),
              description : li.children('ul').children('p').last().children('.dsc').val()
            }
            var name = el.siblings('.tag').val();
          }
          if (value.type == 'array') {
            value.items = '';
            li.html(_emptyArr(name, value.description));
            var list = $('<li>');
            list.append('<p>').children('p').append(
              _keyNmae('items','items'),
              _typeSelect(),
              _dscInput()
            );
            li.children('ul').children().last().before(list);
          } else {
            var content = _checkType(value, name, true);
            li.html(content);
            if (value.type == 'object') {
              content.find('.tag').after(_typeSelect('object'));
            }
          }
          _numSet();
        };
  
        var _numSet = function () {
          var num = 1;
          var numBox = viewBox.find('.tree-num');
          numBox.html('');
          numBox.css('height', viewBox.find('.json-tree').height() + 'px');
          viewBox.find('.json-tree').find('p').each(function() {
            var i = $('<i>', {
              class: 'num',
              text: num
            });
            var hided = false;
            $(this).parents('li').each(function () {
              if($(this).css('display') == 'none') {
                i.css('display', 'none');
                return false;
              }
            });
            numBox.append(i);
            num ++;
          })
        };
  
        var _toggleAction = function () {
          viewBox.delegate(".json-tree .toggle", "click", function (event) {
            if ($(this).hasClass('closed')) {
              $(this).parent().siblings('li').show(200, _numSet);
              $(this).removeClass('closed')
                .parent().find('.hided').remove();
            } else {
              $(this).parent().siblings('li').hide(200, _numSet);
              $(this).addClass('closed')
                .parent().append('<span class="hided">...</span>');
            }
            event.stopPropagation();
          });
        };
  
        var _deleteAction = function () {
          viewBox.delegate(".json-tree .delete", "click", function () {
            var target = $(this).closest('li');
            var fa = target.parent();
            if (target.siblings('li').length == 0 && !settings.apiEditMode)
            {
              alert(settings.arrAlert);
            } else {
              target.remove();
              if(!settings.apiEditMode) {
                _reorder(fa);
              }
              _numSet();
              viewBox.trigger('changeContent');
            }
          });
        };
  
        var _addAction = function () {
          viewBox.delegate('.json-tree .add', "click", function () {
            var fa = $(this).closest('ul');
            if(!settings.apiEditMode) {
              var target = fa.children('li').last();
              target.after(target.clone(true));
              _reorder(fa);
            } else {
              var li = $('<li>');
              li.append('<p>').children('p').append(
                _keyNmae('','' , true),
                _typeSelect(),
                _dscInput(),
                _delete(true)
              );
              (fa.children().last()).before(li);
            }
            _numSet();
            viewBox.trigger('changeContent');
          });
        };
  
        var _apiInfoAction = function () {
          viewBox.delegate('select', 'change', function() {
            var value = $(this).val();
            _endInput($(this));
          });
        };
  
        var JSONTreeRender = function () {
          viewBox.html(
            $('<div>', {
              class: 'json-tree'
            }).append(_checkType(data)));
  
          if (settings.collapsible) {
            _toggleAction();
          }
          if (!settings.readOnly || settings.apiEditMode) {
            _deleteAction();
            _addAction();
          }
          if (settings.apiEditMode) {
            _apiInfoAction();
          }
          if (settings.onChange) {
            settings.onChange(data);
          }
  
          viewBox.find('.json-tree').prepend($('<div>', {
            class: 'tree-num'
          }));
          _numSet();
  
          viewBox.delegate('input', 'change input propertychange', function () {
            viewBox.trigger('changeContent');
          });
        };
  
        JSONTreeRender();
  
        return viewBox;
      },
  
      getTreeData: function () {
        var viewBox = $(this);
        if ($(this).find('.json-tree-base').length > 0) {
          viewBox = $(this).find('.json-tree-base');
        }
        var _getSingleLevel = function (dom) {
          var value;
          var ul = dom.find('ul').first();
          if (ul.data('type') == 'arr') {
            value = [];
            ul.children('li').each(function () {
              var content = _getContent($(this));
              value.push(content);
            });
            return value;
          } else if (ul.data('type') == 'obj') {
            value = {};
            ul.children('li').each(function () {
              var tag = $(this).find('.tag').first().text().replace(': ', '');
              var content = _getContent($(this));
              value[tag] = content;
            });
            return value;
          }
        };
  
        var _getContent = function (dom) {
          if (dom.find('ul').length > 0) {
            return _getSingleLevel(dom);
          } else {
            var content = dom.find('.content');
            var value = content.val() || content.text();
            return value;
          }
        };
  
        var getTreeData = function () {
          return _getSingleLevel(viewBox);
        };
        return getTreeData();
      },
  
      getApiData: function () {
        var viewBox = $(this);
  
        var _getSingleLevel = function (dom, dsc) {
          var ul = dom.find('ul').first();
          var data = {};
          if (ul.data('type') == 'array') {
            data.type = 'array';
            ul.children('li').each(function () {
              var content = _getContent($(this));
              data.items = content;
            });
            var dscBox = ul.children('p').find('.dsc');
            var dscValue = dscBox.val() || dscBox.text();
            if (dscValue != '') {
              data.description = dscValue;
            }
            return data;
          } else if (ul.data('type') == 'object') {
            data.type = 'object';
            data.properties = {};
            if (dsc != '' && typeof(dsc) !== 'undefined') {
              data.description = dsc;
            }
            ul.children('li').each(function () {
              var tagDom = $(this).find('.tag').first();
              var tag = tagDom.val() || tagDom.text().replace(': ', '');
              var content = _getContent($(this));
              data.properties[tag] = content;
            });
            return data;
          }
        };
  
        var _getContent = function (dom, isFirst) {
          if (dom.find('ul').length > 0) {
            var dsc;
            if (isFirst) {
              dsc = '';
            } else {
              var dscBox = dom.children('ul').children('p').find('.dsc');
              dsc = dscBox.val();
            }
            return _getSingleLevel(dom, dsc);
          } else {
            var data = {};
            data.type = dom.find('select').val() || dom.find('.content').text();
            data.description = dom.find('.dsc').val() || dom.find('.dsc').text();
            return data;
          }
        };
  
        var getApiData = function () {
          var checkInput = true;
          viewBox.find('input').each(function() {
            if ($(this).val() == '') {
              checkInput = false;
              return false;
            }
          });
          if (!checkInput) {
            return '输入不能为空！';
          } else {
            var checkObj = true;
            viewBox.find('ul').each(function() {
              if ($(this).children('li').length == 0) {
                checkObj = false;
                return false;
              }
            });
            if (!checkObj) {
              return 'Object不能为空！';
            } else {
              return _getContent(viewBox, true);
            }
          }
        };
  
        return getApiData();
      },
  
      JSONTree: function (data) {
        var createBox = $(this);
        createBox.html('').append(
          $('<div>', {
            class: 'json-card'
          }).append(
            '<h5 class="title"><i class="fa fa-pencil-square-o"></i> 编辑</h5>',
            '<div class="json-tree-base"></div>'
          ),
          $('<div>', {
            class: 'json-card'
          }).append(
            '<h5 class="title"><i class="fa fa-eye"></i> 预览</h5>',
            '<div class="json-tree-show"></div>'
          )
        );
        var changefunc = function (changeData) {
          createBox.find('.json-tree-show').JSONTreeSingle(changeData, { readOnly: true });
        };
        var options = {
          onChange: changefunc
        };
        createBox.find('.json-tree-base').JSONTreeSingle(data, options);
      },
      JSONApiTree: function (data) {
        var options = {
          type: 2,
          readOnly: true,
          arrAddable: false
        };
        $(this).JSONTreeSingle(data, options);
      },
      JSONApiEdit: function (data) {
        var options = {
          type: 2,
          readOnly: true,
          arrAddable: false,
          apiEditMode: true
        };
        $(this).JSONTreeSingle(data, options);
      }
    });
  })(jQuery);